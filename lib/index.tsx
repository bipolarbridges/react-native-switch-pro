import React from 'react';
import PropTypes, { InferProps } from 'prop-types';
import {
  ViewPropTypes,
  ColorPropType,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  PanResponderInstance,
  ViewStyle,
} from 'react-native';

const SCALE = 6 / 5;

type Props = InferProps<typeof Switch.propTypes>;
type State = {
    value: boolean,
    toggleable: boolean,
    alignItems: 'flex-end' | 'flex-start',
    handlerAnimation: Animated.Value,
    switchAnimation: Animated.Value,
};

export default class Switch extends React.Component<Props, State> {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    value: PropTypes.bool,
    disabled: PropTypes.bool,
    circleColorActive: ColorPropType,
    circleColorInactive: ColorPropType,
    backgroundActive: ColorPropType,
    backgroundInactive: ColorPropType,
    onAsyncPress: PropTypes.func,
    onSyncPress: PropTypes.func,
    style: ViewPropTypes.style,
    circleStyle: ViewPropTypes.style,
  };

  static defaultProps = {
    width: 40,
    height: 21,
    value: false,
    disabled: false,
    circleColorActive: 'white',
    circleColorInactive: 'white',
    backgroundActive: '#43d551',
    backgroundInactive: '#dddddd',
    onAsyncPress: (callback) => {callback(true); },
  };

  private offset: number;
  private handlerSize: number;

  private readonly _panResponder: PanResponderInstance;

  constructor (props: Props, context) {
    super(props, context);
    const { width, height, value } = props;

    this.offset = width - height + 1;
    this.handlerSize = height - 2;

    this.state = {
      value,
      toggleable: true,
      alignItems: value ? 'flex-end' : 'flex-start',
      handlerAnimation: new Animated.Value(this.handlerSize),
      switchAnimation: new Animated.Value(value ? -1 : 1),
    };

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderGrant: this._onPanResponderGrant,
      onPanResponderMove: this._onPanResponderMove,
      onPanResponderRelease: this._onPanResponderRelease,
    });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // unify inner state and outer props
    if (this.props.value === prevState.value) {
      return;
    }

    if (typeof this.props.value !== 'undefined' && this.props.value !== prevProps.value) {
      /*
       /* you can add animation when changing value programmatically like following:
       /* this.animateHandler(this.handlerSize * SCALE, () => {
      /*   setTimeout(() => {
      /*    this.toggleSwitchToValue(true, nextProps.value)
      /*    }, 800)
      /* })
       */
      this.toggleSwitchToValue(true, this.props.value);
    }
  }

  _onPanResponderGrant = (evt, gestureState) => {
    const { disabled } = this.props;
    if (disabled) return;

    this.setState({toggleable: true});
    this.animateHandler(this.handlerSize * SCALE);
  }

  _onPanResponderMove = (evt, gestureState) => {
    const { value } = this.state;
    const { disabled } = this.props;
    if (disabled) return;

    this.setState({
      toggleable: value ? (gestureState.dx < 10) : (gestureState.dx > -10),
    });
  }

  _onPanResponderRelease = (evt, gestureState) => {
    const { toggleable } = this.state;
    const { disabled, onAsyncPress, onSyncPress } = this.props;

    if (disabled) return;

    if (toggleable) {
      if (onSyncPress) {
        this.toggleSwitch(true, onSyncPress);
      } else {
        onAsyncPress(this.toggleSwitch);
      }
    } else {
      this.animateHandler(this.handlerSize);
    }
  }

  toggleSwitch = (result: boolean, callback: (res: boolean) => any = () => null) => {
    const { value } = this.state;
    this.toggleSwitchToValue(result, !value, callback);
  }

  toggleSwitchToValue = (result: boolean, toValue: boolean, callback: (res: boolean) => any = () => null) => {
    const { switchAnimation } = this.state;

    this.animateHandler(this.handlerSize);
    if (result) {
      this.animateSwitch(toValue, () => {
        this.setState({
          value: toValue,
          alignItems: toValue ? 'flex-end' : 'flex-start',
        }, () => {
          callback(toValue);
        });
        switchAnimation.setValue(toValue ? -1 : 1);
      });
    }
  }

  animateSwitch = (value, callback = () => null) => {
    const { switchAnimation } = this.state;

    Animated.timing(switchAnimation,
      {
        toValue: value ? this.offset : -this.offset,
        duration: 200,
        easing: Easing.linear,
      },
    ).start(callback);
  }

  animateHandler = (value, callback = () => null) => {
    const { handlerAnimation } = this.state;

    Animated.timing(handlerAnimation,
      {
        toValue: value,
        duration: 200,
        easing: Easing.linear,
      },
    ).start(callback);
  }

  render() {
    const { switchAnimation, handlerAnimation, alignItems, value } = this.state;
    const {
      backgroundActive, backgroundInactive,
      width, height, circleColorActive, circleColorInactive, style,
      circleStyle,
      ...rest } = this.props;

    const interpolatedBackgroundColor = switchAnimation.interpolate({
      inputRange: value ? [-this.offset, -1] : [1, this.offset],
      outputRange: [backgroundInactive, backgroundActive],
      extrapolate: 'clamp',
    });

    const interpolatedCircleColor = switchAnimation.interpolate({
      inputRange: value ? [-this.offset, -1] : [1, this.offset],
      outputRange: [circleColorInactive, circleColorActive],
      extrapolate: 'clamp',
    });

    const circlePosition = (v: boolean) => {
      const modifier = v ? 1 : -1;
      let position = modifier * -1;

      if (circleStyle && (circleStyle as ViewStyle).borderWidth) {
        position += modifier;
      }

      if (style && (style as ViewStyle).borderWidth) {
        position += modifier;
      }

      return position;
    };

    const interpolatedTranslateX = switchAnimation.interpolate({
      inputRange: value ? [-this.offset, -1] : [1, this.offset],
      outputRange: value ? [-this.offset, circlePosition(value)] : [circlePosition(value), this.offset],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        {...rest}
        {...this._panResponder.panHandlers}
        style={[styles.container, {
          width, height,
          alignItems,
          borderRadius: height / 2,
          backgroundColor: interpolatedBackgroundColor,
        }, style]}>
        <Animated.View style={[{
          backgroundColor: interpolatedCircleColor,
          width: handlerAnimation,
          height: this.handlerSize,
          borderRadius: height / 2,
          transform: [{ translateX: interpolatedTranslateX }],
        }, circleStyle]} />
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
});
